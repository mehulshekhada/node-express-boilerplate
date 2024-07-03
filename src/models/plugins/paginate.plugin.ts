import { Schema, Document, Model } from 'mongoose';

export interface QueryResult<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface PaginateOptions {
  sortBy?: string;
  populate?: string;
  limit?: number;
  page?: number;
}

interface PaginateModel<T extends Document> extends Model<T> {
  paginate(filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult<T>>;
}

const paginate = <T extends Document>(schema: Schema<T>) => {
  schema.statics.paginate = async function (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult<T>> {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria: string[] = [];
      options.sortBy.split(',').forEach((sortOption: string) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    } else {
      sort = 'createdAt';
    }

    const limit = options.limit && parseInt(options.limit.toString(), 10) > 0 ? parseInt(options.limit.toString(), 10) : 10;
    const page = options.page && parseInt(options.page.toString(), 10) > 0 ? parseInt(options.page.toString(), 10) : 1;
    const skip = (page - 1) * limit;

    const countPromise = this.countDocuments(filter).exec();
    let docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
      options.populate.split(',').forEach((populateOption: string) => {
        docsPromise = docsPromise.populate(
          populateOption
            .split('.')
            .reverse()
            .reduce((a, b) => ({ path: b, populate: a }))
        );
      });
    }

    docsPromise = docsPromise.exec();

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      return {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
    });
  };
};

export default paginate;
