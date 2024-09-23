resource "azurerm_container_group" "dm_cg" {
  name                = "drummachine"
  location            = azurerm_resource_group.ws_public_rg.location
  resource_group_name = azurerm_resource_group.ws_public_rg.name
  os_type             = "Linux"
  subnet_ids = [azurerm_subnet.dm_subnet.id]
  ip_address_type = "Private"
  container {
    name   = "drummachine"
    image  = "public.ecr.aws/e2l3m9j8/drummachine:latest"
    cpu    = "1.0"
    memory = "2.0"
    ports {
      port     = 3000
      protocol = "TCP"
    }
  }
}
