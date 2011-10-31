UPDATE `tomoe_character` SET `feature` = NULL WHERE `feature` IS NOT NULL;
TRUNCATE TABLE `tomoe_writing`;