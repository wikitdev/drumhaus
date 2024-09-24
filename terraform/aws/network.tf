resource "aws_vpc" "dm_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "dmvpc"
  }
}

resource "aws_subnet" "dm_private_subnet" {
  vpc_id                  = aws_vpc.dm_vpc.id
  cidr_block              = "10.0.0.0/24"
  availability_zone       = "${var.region}a"
  map_public_ip_on_launch = false
  tags = {
    Name = "dmprivatesubnet"
  }
}

resource "aws_subnet" "dm_public_subnet" {
  vpc_id                  = aws_vpc.dm_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.region}b"
  map_public_ip_on_launch = true
  tags = {
    Name = "dmpublicsubnet"
  }
}

resource "aws_eip" "dm_eip" {
  domain = "vpc"
}

resource "aws_internet_gateway" "dm_igw" {
  vpc_id = aws_vpc.dm_vpc.id
  tags = {
    Name = "dmigw"
  }
}

resource "aws_nat_gateway" "dm_ng" {
  allocation_id = aws_eip.dm_eip.id
  subnet_id     = aws_subnet.dm_public_subnet.id
  tags = {
    Name = "dmnatgateway"
  }
}

resource "aws_route_table" "dm_public_rt" {
  vpc_id = aws_vpc.dm_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dm_igw.id
  }
  tags = {
    Name = "dmpublicrt"
  }
}

resource "aws_route_table" "dm_private_rt" {
  vpc_id = aws_vpc.dm_vpc.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dm_ng.id
  }
  tags = {
    Name = "dmprivatert"
  }
}

resource "aws_route_table_association" "dm_rta" {
  subnet_id      = aws_subnet.dm_private_subnet.id
  route_table_id = aws_route_table.dm_private_rt.id
}

resource "aws_route_table_association" "dm_rta2" {
  subnet_id      = aws_subnet.dm_public_subnet.id
  route_table_id = aws_route_table.dm_public_rt.id
}

resource "aws_security_group" "dm_sg" {
  vpc_id = aws_vpc.dm_vpc.id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "dmsecuritygroup"
  }
}

resource "aws_lb" "dm_elb" {
  name               = "dmelb"
  internal           = false
  load_balancer_type = "application"
  security_groups = [ aws_security_group.dm_sg.id ]
  subnets = [
    aws_subnet.dm_private_subnet.id,
    aws_subnet.dm_public_subnet.id
  ]
}

resource "aws_lb_target_group" "dm_tg" {
  name        = "dmtargetgroup"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.dm_vpc.id
  target_type = "ip"
  health_check {
    port                = 80
    protocol            = "HTTP"
    path                = "/"
    timeout             = 3
    interval            = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "dm_listener" {
  load_balancer_arn = aws_lb.dm_elb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dm_tg.arn
  }
}
