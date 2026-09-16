"use strict";

const express = require("express");
const companyController = require("../controllers/companyController");
const deliveryController = require("../controllers/deliveryController");
const referenceController = require("../controllers/referenceController");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/companies/search", companyController.search);
router.get("/companies/:codigo/rows", companyController.getRowsForCompany);

router.post("/sheet-rows/:id/deliver", upload.single("file"), deliveryController.deliver);
router.post("/sheet-rows/:id/undo", deliveryController.undo);
router.get("/sheet-rows/:id/file", deliveryController.getFile);

router.get("/delivered", deliveryController.listDelivered);
router.post("/delivered/clear", deliveryController.clearAll);

router.post("/reference/import", upload.single("spreadsheet"), referenceController.importReference);

module.exports = router;
