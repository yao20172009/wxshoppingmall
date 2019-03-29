function ActiveDetailsData(id) {
  return {
    query: `query promotion($id: String!){
      promotion(id: $id) {
        name
        kindName
        kind
        doneTimes
        supplier
        id
        startTime
        limitTimes
        customerLimit
        desc
        endTime
        paused
        imageUrl
        items {
          id
          quantity
          unit
          specialPrice
          product {
            id   
            name
            price
            productUnits {
            name
            price
            }
          }
          amount
          gift {
            product {
              name
            }
          }
        }
      }
    }`,
    variables: {
      id: id
    }
  }
}

module.exports = {
  ActiveDetailsData
}