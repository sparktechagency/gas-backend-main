import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { ILocation } from './location.interface';
import { Location } from './location.models';
import QueryBuilder from '../../builder/QueryBuilder';

const createlocation = async (payload: ILocation) => {
  const result = await Location.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create vehicle');
  }
  return result;
};
const getAlllocation = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(Location.find(), query)
    .search(['location', 'fuelType'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};
const getlocationById = async () => {};
const updatelocation = async () => {};
const deletelocation = async () => {};

export const locationService = {
  createlocation,
  getAlllocation,
  getlocationById,
  updatelocation,
  deletelocation,
};
