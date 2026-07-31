import { Router } from 'express';
import { TrainController } from '../controllers/train.controller';

const router: Router = Router();

// Train endpoints
router.get('/trains', TrainController.getTrains);
router.get('/trains/:id', TrainController.getTrainById);
router.get('/trains/:id/schedule', TrainController.getTrainSchedule);
router.post('/trains', TrainController.createTrain);

// Station endpoints
router.get('/stations', TrainController.getStations);
router.get('/stations/autocomplete', TrainController.autocompleteStations);
router.get('/stations/:code', TrainController.getStationByCode);

export default router;
