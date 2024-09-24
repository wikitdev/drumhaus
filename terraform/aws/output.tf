output "dm_url" {
  value = "http://${aws_lb.dm_elb.dns_name}"
}
