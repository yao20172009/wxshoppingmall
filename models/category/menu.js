function QueryMenu(supplierId) {
  return {
    query: `query categories($supplierId: String!){
      ratesCount(ratableId:$supplierId)
      readSupplierShareNoify(supplierId:$supplierId)
      supplier(id:$supplierId){
        id
        name
        businesses
        address
        industryName
        monthSales
        followed
        deliveryRate
        productRate
        serviceRate
        logo
        area{
          id
          name
        }
        shareReward {
          kind
          points
          percent
          both
        }
      }
      viewer{
        id
        categories(supplierId: $supplierId){
          id
          name
          isPromotion
        }
      }
    }`,
    variables: {
      supplierId: supplierId
    }
  }
}

module.exports = {
  QueryMenu
};