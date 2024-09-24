resource "aws_ecs_cluster" "dm_cluster" {
  name = "drummachine"
}

resource "aws_ecs_task_definition" "dm_td" {
  family                   = "dmtaskdef"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.dm_role.arn
  container_definitions = jsonencode([
    {
      name         = "drummachine"
      image        = "public.ecr.aws/e2l3m9j8/drummachine:latest"
      cpu          = 1024
      memory       = 2048
      network_mode = "awsvpc"
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.dm_log_group.name
          awslogs-region        = "us-east-2"
          awslogs-stream-prefix = "ecs"
          mode                  = "non-blocking"
          max-buffer-size       = "25m"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "dm_service" {
  name            = "dmservice"
  cluster         = aws_ecs_cluster.dm_cluster.id
  task_definition = aws_ecs_task_definition.dm_td.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = [aws_subnet.dm_private_subnet.id]
    security_groups  = [aws_security_group.dm_sg.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.dm_tg.arn
    container_name   = "drummachine"
    container_port   = 80
  }
}
