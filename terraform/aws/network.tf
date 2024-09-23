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

resource "aws_internet_gateway" "dm_igw" {
  vpc_id = aws_vpc.dm_vpc.id
  tags = {
    Name = "dmigw"
  }
}

resource "aws_route_table" "dm_rt" {
  vpc_id = aws_vpc.dm_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dm_igw.id
  }
  tags = {
    Name = "dmrt"
  }
}

resource "aws_route_table_association" "dm_rta" {
  subnet_id      = aws_subnet.dm_private_subnet.id
  route_table_id = aws_route_table.dm_rt.id
}

resource "aws_route_table_association" "dm_rta2" {
  subnet_id      = aws_subnet.dm_public_subnet.id
  route_table_id = aws_route_table.dm_rt.id
}

resource "aws_security_group" "dm_lb_sg" {
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
    Name = "dmlbsecuritygroup"
  }
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
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.dm_lb_sg.id]
  }
  tags = {
    Name = "dmsecuritygroup"
  }
}

resource "aws_lb" "dm_elb" {
  name               = "dmelb"
  internal           = false
  load_balancer_type = "network"
  subnets = [
    aws_subnet.dm_private_subnet.id,
    aws_subnet.dm_public_subnet.id
  ]
}

resource "aws_lb_target_group" "dm_tg" {
  name        = "dmtargetgroup"
  port        = 3000
  protocol    = "TCP"
  vpc_id      = aws_vpc.dm_vpc.id
  target_type = "ip"
}

resource "aws_lb_listener" "dm_listener" {
  load_balancer_arn = aws_lb.dm_elb.arn
  port              = 80
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dm_tg.arn
  }
}
