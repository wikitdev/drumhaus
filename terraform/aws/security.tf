resource "aws_cloudwatch_log_group" "dm_log_group" {
  name              = "/aws/ecs/drummachine"
  retention_in_days = 1
}

resource "aws_iam_role" "dm_role" {
  name = "dmrole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

data "aws_iam_policy" "dm_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "dm_policy_attachment" {
  role       = aws_iam_role.dm_role.name
  policy_arn = data.aws_iam_policy.dm_policy.arn
}
