import { roleController } from "../controllers/roles";
import { Router } from "express";

const router = Router();

router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.patch('/:id', roleController.updateRole);

export default router;