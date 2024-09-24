output "dm_url" {
  value = "http://${azurerm_public_ip.dm_pip.ip_address}"
}
