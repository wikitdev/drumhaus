resource "azurerm_virtual_network" "dm_vn" {
  name                = "dm-vn"
  location            = azurerm_resource_group.ws_public_rg.location
  resource_group_name = azurerm_resource_group.ws_public_rg.name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "dm_subnet" {
  #checkov:skip=CKV2_AZURE_31::Example how to skip certain checks
  name                 = "dm-subnet"
  resource_group_name  = azurerm_resource_group.ws_public_rg.name
  virtual_network_name = azurerm_virtual_network.dm_vn.name
  address_prefixes     = ["10.0.0.0/24"]
  delegation {
    name = "acidelegation"
    service_delegation {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_public_ip" "dm_pip" {
  name                = "dm-pip"
  location            = azurerm_resource_group.ws_public_rg.location
  resource_group_name = azurerm_resource_group.ws_public_rg.name
  allocation_method   = "Static"
}

resource "azurerm_lb" "dm_lb" {
  name                = "dm-lb"
  location            = azurerm_resource_group.ws_public_rg.location
  resource_group_name = azurerm_resource_group.ws_public_rg.name
  frontend_ip_configuration {
    name                 = "dm-feip"
    public_ip_address_id = azurerm_public_ip.dm_pip.id
  }
}

resource "azurerm_lb_backend_address_pool" "dm_lb_bap" {
  loadbalancer_id = azurerm_lb.dm_lb.id
  name            = "dm-bap"
}

resource "azurerm_lb_backend_address_pool_address" "dm_lb_bap" {
  name                    = "dm-bap-address"
  backend_address_pool_id = azurerm_lb_backend_address_pool.dm_lb_bap.id
  ip_address              = azurerm_container_group.dm_cg.ip_address
  virtual_network_id      = azurerm_virtual_network.dm_vn.id
}

resource "azurerm_lb_rule" "dm_lb_rule" {
  loadbalancer_id                = azurerm_lb.dm_lb.id
  name                           = "dm-lb-rule"
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  frontend_ip_configuration_name = azurerm_lb.dm_lb.frontend_ip_configuration[0].name
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.dm_lb_bap.id]
}
