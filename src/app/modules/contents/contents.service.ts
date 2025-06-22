/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import Contents from './contents.models';
import { IContents } from './contents.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { deleteManyFromS3, uploadManyToS3, uploadToS3 } from '../../utils/s3';
import { UploadedFiles } from '../../interface/common.interface';

// Create a new content
const createContents = async (payload: IContents, files: any) => {
  if (files) {
    const { banner, emergencyFuelBanner, discountBanner } =
      files as UploadedFiles;

    if (banner?.length) {
      const imgsArray: { file: any; path: string; key?: string }[] = [];

      banner?.map(async image => {
        imgsArray.push({
          file: image,
          path: `images/banner`,
        });
      });

      payload.banner = await uploadManyToS3(imgsArray);
    }

    if (emergencyFuelBanner?.length) {
      payload.emergencyFuelBanner = (await uploadToS3({
        file: emergencyFuelBanner[0],
        fileName: `images/banner/${emergencyFuelBanner[0].originalname}`,
      })) as string;
    }

    if (discountBanner?.length) {
      payload.discountBanner = (await uploadToS3({
        file: discountBanner[0],
        fileName: `images/banner/${discountBanner[0].originalname}`,
      })) as string;
    }
  }

  const result = await Contents.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Content creation failed');
  }
  return result;
};

// Get all contents
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAllContents = async (query: Record<string, any>) => {
  const ContentModel = new QueryBuilder(
    Contents.find().populate(['createdBy']),
    query,
  )
    .search(['createdBy'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await ContentModel.modelQuery;
  const meta = await ContentModel.countTotal();
  return {
    data,
    meta,
  };
};

// Get content by ID
const getContentsById = async (id: string) => {
  const result = await Contents.findById(id).populate(['createdBy']);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Oops! Content not found');
  }
  return result;
};

const deleteBanner = async (key: string) => {
  const content = await Contents.findOne({});

  if (!content) {
    throw new AppError(httpStatus.NOT_FOUND, 'Content not found');
  }

  const result = await Contents.findByIdAndUpdate(
    content?._id,
    {
      $pull: { banner: { key: key } },
    },
    { new: true },
  );

  const newKey: string[] = [];
  newKey.push(`images/banner${key}`);

  if (newKey) {
    await deleteManyFromS3(newKey);
  }

  return result;
};
// Update content
const updateContents = async (payload: Partial<IContents>, files: any) => {
  const content = await Contents.find({});

  if (!content.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Content not found');
  }

  const { deleteKey, ...updateData } = payload;

  const update: any = { ...updateData };

  if (files) {
    const { banner, emergencyFuelBanner, discountBanner } =
      files as UploadedFiles;

    if (banner?.length) {
      const imgsArray: { file: any; path: string; key?: string }[] = [];

      banner.map(b =>
        imgsArray.push({
          file: b,
          path: `images/banner`,
        }),
      );

      payload.banner = await uploadManyToS3(imgsArray);
    }

    if (emergencyFuelBanner?.length) {
      payload.emergencyFuelBanner = (await uploadToS3({
        file: emergencyFuelBanner[0],
        fileName: `images/banner/${emergencyFuelBanner[0].originalname}`,
      })) as string;
    }

    if (discountBanner?.length) {
      payload.discountBanner = (await uploadToS3({
        file: discountBanner[0],
        fileName: `images/banner/${discountBanner[0].originalname}`,
      })) as string;
    }
  }

  if (deleteKey && deleteKey.length > 0) {
    const newKey: string[] = [];
    deleteKey.map((key: any) => newKey.push(`images/banner${key}`));
    if (newKey?.length > 0) {
      await deleteManyFromS3(newKey);
    }

    await Contents.findByIdAndUpdate(content[0]._id, {
      $pull: { banner: { key: { $in: deleteKey } } },
    });
  }

  if (payload?.banner && payload.banner.length > 0) {
    await Contents.findByIdAndUpdate(content[0]._id, {
      $push: { banner: { $each: payload.banner } },
    });
  }

  const result = await Contents.findByIdAndUpdate(content[0]._id, update, {
    new: true,
  });

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Content update failed');
  }

  return result;
};
// Delete content
const deleteContents = async (id: string) => {
  const result = await Contents.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: true,
      },
    },
    { new: true },
  );

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Content deletion failed');
  }

  return result;
};

export const contentsService = {
  createContents,
  getAllContents,
  getContentsById,
  updateContents,
  deleteContents,
  deleteBanner,
};
