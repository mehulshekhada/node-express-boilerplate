import morgan from 'morgan';
import config from './config';
import logger from './logger';

morgan.token('message', (req, res: any) => res.locals.errorMessage || '');

const getIpFormat = (): string => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;


export default  {
  successHandler : morgan(successResponseFormat, {
    skip: (req, res) => res.statusCode >= 400,
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
  errorHandler : morgan(errorResponseFormat, {
    skip: (req, res) => res.statusCode < 400,
    stream: { write: (message: string) => logger.error(message.trim()) },
  })
}

