import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { ILike, Repository } from "typeorm";
import { ProductImage } from "./entities/product-images.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { v4 as uuidv4 } from "uuid";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { CategoryService } from "src/category/category.service";
import { CommonResSwagger } from "./utils/common-res-swagger";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Category } from "src/category/entity/category.entity";
import { PaginationDto } from "./dto/pagination.dto";
import { StripeService } from "src/stripe/stripe.service";
import 'multer';

@Injectable()
export class ProductService {
  private s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,

    private configService: ConfigService,

    private categoryService: CategoryService,

    private stripeService: StripeService,
  ) {}

  async findCategory(categoryId: number): Promise<Category> {
    const category = await this.categoryService.findById(categoryId);

    if (!category) {
      throw new BadRequestException("Error invalid categoryId");
    }

    return category;
  }

  async findProduct(id: number): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: {
        id,
      },
      relations: {
        images: true,
        category: true,
      },
      order: {
        images: {
          id: "ASC",
        },
      },
    });
  }

  async checkProductImage(id: number): Promise<ProductImage> {
    const productImage = await this.productImageRepository.findOne({
      where: {
        id,
      },
    });

    if (!productImage) {
      throw new BadRequestException("Error invalid product image id");
    }

    return productImage;
  }

  async deleteImageFromS3(imageUrl: string) {
    const delObjCmd = new DeleteObjectCommand({
      Bucket: this.configService.get<string>("AWS_BUCKET_NAME"),
      Key: `product/${imageUrl}`,
    });
    return await this.s3.send(delObjCmd);
  }

  async sendImageToS3(file: Express.Multer.File, newFileName: string) {
    const putObjCmd = new PutObjectCommand({
      Bucket: this.configService.get<string>("AWS_BUCKET_NAME"),
      Key: `product/${newFileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    return await this.s3.send(putObjCmd);
  }

  genFileName(file: Express.Multer.File): string {
    const fileExt = file.mimetype.split("/").pop();
    const newFileName = `${uuidv4()}.${fileExt}`;
    return newFileName;
  }

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    const { name, description, price, stockQuantity, categoryId } =
      createProductDto;

    const category = await this.findCategory(categoryId);

    const product = this.productRepository.create({
      name,
      description,
      price,
      stockQuantity,
      category,
    });
    const productSave = await this.productRepository.save(product);

    const productImageSave = files.map(async (file) => {
      const newFileName = this.genFileName(file);

      const productImage = this.productImageRepository.create({
        imageUrl: newFileName,
        product: productSave,
      });
      await this.productImageRepository.save(productImage);

      await this.sendImageToS3(file, newFileName);
    });

    await Promise.all(productImageSave);

    let productWithImages = await this.findProduct(productSave.id);

    if (productWithImages) {
      const createProductStripe = {
        ...productWithImages,
        categoryId: productWithImages.category.id,
        images: productWithImages.images.map((image) =>
          String(
            `${this.configService.get<string>("ACCESS_AWS_BUCKET_NAME")}/${this.configService.get<string>("ACCESS_AWS_BUCKET_FOLDER")}/${image.imageUrl}`,
          ),
        ),
      };
      const stripeRes =
        await this.stripeService.createProduct(createProductStripe);

      await this.productRepository.update(productSave.id, {
        stripeProductId: stripeRes.productData.id,
        stripePriceId: stripeRes.priceData.id,
      });

      productWithImages = {
        ...productWithImages,
        stripeProductId: stripeRes.productData.id,
        stripePriceId: stripeRes.priceData.id,
      };
    }

    return productWithImages as Product;
  }

  async find(
    page: number = 1,
    limit: number = 10,
    categoryName?: string,
    productName?: string,
  ): Promise<PaginationDto<Product>> {
    let products: Product[] = [];
    let totalItems: number = 0;

    if (!categoryName && !productName) {
      const [productsFind, count] = await this.productRepository.findAndCount({
        order: {
          createdAt: "DESC",
          images: {
            createdAt: "ASC",
          },
        },
        relations: {
          images: true,
          category: true,
        },
      });
      products = productsFind;
      totalItems = count;
    }

    if (categoryName && !productName) {
      const [productsFind, count] = await this.productRepository.findAndCount({
        relations: {
          images: true,
          category: true,
        },
        where: {
          category: {
            name: categoryName,
          },
        },
        order: {
          createdAt: "DESC",
          images: {
            createdAt: "ASC",
          },
        },
      });
      products = productsFind;
      totalItems = count;
    }

    if (!categoryName && productName) {
      const [productsFind, count] = await this.productRepository.findAndCount({
        relations: {
          images: true,
          category: true,
        },
        where: {
          name: ILike(`%${productName}%`),
        },
        order: {
          createdAt: "DESC",
          images: {
            createdAt: "ASC",
          },
        },
      });
      products = productsFind;
      totalItems = count;
    }

    if (categoryName && productName) {
      const [productsFind, count] = await this.productRepository.findAndCount({
        relations: {
          images: true,
          category: true,
        },
        where: {
          name: ILike(`%${productName}%`),
          category: {
            name: categoryName,
          },
        },
        order: {
          createdAt: "DESC",
          images: {
            createdAt: "ASC",
          },
        },
      });
      products = productsFind;
      totalItems = count;
    }

    const productPaginate = products.slice(
      (page - 1) * limit,
      page * limit,
    );
    const itemPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemPerPage);

    return {
      data: productPaginate,
      pagination: {
        currentPage: page,
        pageSize: itemPerPage,
        totalPages,
        totalItems,
      },
    };
  }

  async findById(id: number): Promise<Product> {
    const product = await this.findProduct(id);

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const {
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      stripeProductId,
      stripePriceId,
      unitLabel,
    } = updateProductDto;
    const product = await this.findProduct(id);

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const category = await this.findCategory(categoryId);

    await this.productRepository.update(product.id, {
      name,
      description,
      price,
      stockQuantity,
      category,
      stripeProductId,
      stripePriceId,
    });

    const { priceUpdate } = await this.stripeService.updateProduct({
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      stripeProductId,
      stripePriceId,
      unitLabel,
    });

    await this.productRepository.update(product.id, {
      stripePriceId: priceUpdate.id,
    });

    const updateProduct = {
      ...updateProductDto,
      id: product.id,
      createdAt: product.createdAt,
      category: product.category,
      images: product.images,
      stripeProductId,
      stripePriceId: priceUpdate.id,
    };

    return updateProduct;
  }

  async delete(id: number, productStripeId: string): Promise<CommonResSwagger> {
    const product = await this.findProduct(id);
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    await this.productRepository.delete(id);

    const deleteProductImages = product.images.map(async (image) => {
      return await this.deleteImageFromS3(image.imageUrl);
    });
    await Promise.all(deleteProductImages);

    await this.stripeService.deleteProduct(productStripeId);

    return {
      message: "Delete product success",
    };
  }

  async updateImage(
    id: number,
    stripeProductId: string,
    file: Express.Multer.File,
  ): Promise<ProductImage> {
    const productImage = await this.checkProductImage(id);

    await this.deleteImageFromS3(productImage.imageUrl);

    const newFileName = this.genFileName(file);
    await this.productImageRepository.update(id, {
      imageUrl: newFileName,
    });

    await this.sendImageToS3(file, newFileName);

    await this.stripeService.updateProductImage(
      stripeProductId,
      `${this.configService.get<string>("ACCESS_AWS_BUCKET_NAME")}/${this.configService.get<string>("ACCESS_AWS_BUCKET_FOLDER")}/${productImage.imageUrl}`,
      `${this.configService.get<string>("ACCESS_AWS_BUCKET_NAME")}/${this.configService.get<string>("ACCESS_AWS_BUCKET_FOLDER")}/${newFileName}`,
    );

    const newProductImage = {
      ...productImage,
      imageUrl: newFileName,
    };

    return newProductImage;
  }

  async deleteImage(id: number, stripeProductId: string,): Promise<CommonResSwagger> {
    const productImage = await this.checkProductImage(id);
    await this.productImageRepository.delete(productImage.id);
    await this.deleteImageFromS3(productImage.imageUrl);

    await this.stripeService.deleteProductImage(
      stripeProductId, 
      `${this.configService.get<string>("ACCESS_AWS_BUCKET_NAME")}/${this.configService.get<string>("ACCESS_AWS_BUCKET_FOLDER")}/${productImage.imageUrl}`,
    );

    return {
      message: "Delete product image success",
    };
  }
}
