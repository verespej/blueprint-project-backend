CREATE TABLE `assessment_instance_responses` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`assessment_instance_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assessment_instance_id`) REFERENCES `assessment_instances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `assessment_section_questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`answer_id`) REFERENCES `assessment_section_answers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessment_instance_responses_question_idx` ON `assessment_instance_responses` (`question_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_instance_responses_assessment_instance_question_uniq_idx` ON `assessment_instance_responses` (`assessment_instance_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `assessment_instances` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`assessment_id` text NOT NULL,
	`slug` text NOT NULL,
	`sent_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessment_instances_assessment_idx` ON `assessment_instances` (`assessment_id`);--> statement-breakpoint
CREATE INDEX `assessment_instances_patient_idx` ON `assessment_instances` (`patient_id`);--> statement-breakpoint
CREATE INDEX `assessment_instances_provider_idx` ON `assessment_instances` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_instances_slug_uniq_idx` ON `assessment_instances` (`slug`);--> statement-breakpoint
CREATE TABLE `assessment_section_answers` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`assessment_section_id` text NOT NULL,
	`title` text NOT NULL,
	`valueType` text NOT NULL,
	`value` text NOT NULL,
	`displayOrder` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assessment_section_id`) REFERENCES `assessment_sections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessment_section_answers_assessment_section_title_uniq_idx` ON `assessment_section_answers` (`assessment_section_id`,`title`);--> statement-breakpoint
CREATE TABLE `assessment_section_questions` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`assessment_section_id` text NOT NULL,
	`title` text NOT NULL,
	`disorder_id` text NOT NULL,
	`displayOrder` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assessment_section_id`) REFERENCES `assessment_sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`disorder_id`) REFERENCES `disorders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_section_questions_assessment_section_title_uniq_idx` ON `assessment_section_questions` (`assessment_section_id`,`title`);--> statement-breakpoint
CREATE TABLE `assessment_sections` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessment_sections_assessment_idx` ON `assessment_sections` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`display_name` text,
	`disorder_id` text NOT NULL,
	`locked` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`disorder_id`) REFERENCES `disorders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessments_disorder_idx` ON `assessments` (`disorder_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_full_name_uniq_uniq_idx` ON `assessments` (`full_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_name_uniq_idx` ON `assessments` (`name`);--> statement-breakpoint
CREATE TABLE `disorders` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disorders_name_uniq_idx` ON `disorders` (`name`);--> statement-breakpoint
CREATE TABLE `patient_providers` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`onboarded_at` text NOT NULL,
	`offboarded_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `patient_providers_patient_idx` ON `patient_providers` (`patient_id`);--> statement-breakpoint
CREATE INDEX `patient_providers_provider_idx` ON `patient_providers` (`provider_id`);--> statement-breakpoint
CREATE TABLE `submission_rules` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`filter_type` text NOT NULL,
	`filter_value` text NOT NULL,
	`score_operation` text NOT NULL,
	`eval_operation` text NOT NULL,
	`eval_value` text NOT NULL,
	`action_type` text NOT NULL,
	`action_value` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessment_idx` ON `submission_rules` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uniq_idx` ON `users` (`email`);