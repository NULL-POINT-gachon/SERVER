const transportationRepository = require('../repositories/transportationRepository');

exports.getTransportations = async () => {
  return await transportationRepository.getAllTransportations();
};