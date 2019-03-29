var Product = function (supplierId, categoryId) {
  return {
    query: `query supplierProducts($supplierId: String!, $categoryId: String!){
      viewer {
        supplierProducts(supplierId: $supplierId, categoryId: $categoryId) {
          edges {
            node {
              id
              kindName
              kindDesc
              name
              pkind
              price
              unit
              product{
                imageUrls
                lack
                id
              }
              promotionProduct {
                inventory
                boughtQuantity
                customerLimit
                discountRate
                amount
                sales
                specialPrice
                quantity
                discountAmount
                gift {
                  name
                  product{
                    name
                  }
                  giftId
                  quantity
                }
              }
              unitList {
                id
                productId
                inventory
                isBase
                isDefault
              }
            }
          }
        }
      }
    }`,
    variables: {
      supplierId: supplierId,
      categoryId: categoryId
    }
  }
}

var ProductId = function (id) {
  return {
    query: `query product($id:String!){
      product(id:$id){
        id
        name
        price
        lack
        averageRate
        imageUrls
        inventory
        turnOn
        productUnits{
          id
          isBase
          isDefault
          price
          name
          inventory
        }
      }
    }`,
    variables: {
      id: id,
    }
  }
}

module.exports = {
  Product,
  ProductId
};