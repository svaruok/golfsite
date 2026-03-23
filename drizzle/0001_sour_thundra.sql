CREATE TABLE `charities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`website` varchar(255),
	`featured` boolean DEFAULT false,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charityContributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`charityId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`contributionMonth` varchar(7) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `charityContributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`matchType` enum('5-match','4-match','3-match') NOT NULL,
	`winningNumbers` varchar(255) NOT NULL,
	`prizeAmount` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drawResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `draws` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawMonth` varchar(7) NOT NULL,
	`drawType` enum('random','algorithmic') DEFAULT 'random',
	`status` enum('pending','simulated','published','completed') DEFAULT 'pending',
	`totalPrizePool` decimal(12,2) DEFAULT '0',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `draws_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `golfScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`scoreDate` timestamp NOT NULL,
	`courseId` varchar(255),
	`courseName` text,
	`handicap` decimal(5,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `golfScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prizePoolConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchType` enum('5-match','4-match','3-match') NOT NULL,
	`poolSharePercentage` decimal(5,2) NOT NULL,
	`rollover` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prizePoolConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `prizePoolConfig_matchType_unique` UNIQUE(`matchType`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`planType` enum('monthly','yearly') NOT NULL,
	`status` enum('active','inactive','cancelled','past_due') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `userCharitySelections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`charityId` int NOT NULL,
	`contributionPercentage` decimal(5,2) DEFAULT '10',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCharitySelections_id` PRIMARY KEY(`id`),
	CONSTRAINT `userCharityUnique` UNIQUE(`userId`,`charityId`)
);
--> statement-breakpoint
CREATE TABLE `winners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`userId` int NOT NULL,
	`matchType` enum('5-match','4-match','3-match') NOT NULL,
	`prizeAmount` decimal(12,2) NOT NULL,
	`status` enum('pending_verification','verified','rejected','paid') DEFAULT 'pending_verification',
	`proofUrl` text,
	`verifiedAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `winners_id` PRIMARY KEY(`id`)
);
