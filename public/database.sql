-- Database Structure for Om Sai Enterprises Certificate Verification System

CREATE TABLE IF NOT EXISTS `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `course` varchar(150) NOT NULL,
  `form_type` varchar(20) NOT NULL DEFAULT 'Form C',
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_id` (`certificate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert some sample data
INSERT INTO `certificates` (`certificate_id`, `name`, `course`, `form_type`, `issue_date`, `expiry_date`, `status`) VALUES
('OSE-CERT-1001', 'Rahul Sharma', 'Fire Safety Management', 'Form C', '2023-01-15', '2025-01-14', 'Active'),
('OSE-CERT-1002', 'Priya Patel', 'Industrial Safety', 'Form C', '2023-03-20', '2025-03-19', 'Active'),
('OSE-CERT-1003', 'Amit Kumar', 'First Aid & CPR', 'Form C', '2022-05-10', '2024-05-09', 'Active');
