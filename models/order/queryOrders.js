function Orders(first, after,status) {
  return {
    query:  `query($first: Int!, $after: String,$status:String) {
      viewer {
        orders(first: $first, after: $after,status:$status) {
          edges {
            cursor
            node {
              paidAmount
              supplier {
                id
                name
                industryName
              }
              no
              cancelApplication{
                reason
                status
                statusDesc
              }
              id
              no
              status
              statusName
              address
              receiver
              phone
              deliveryTime
              amount
              originAmount
              items {
                id
                productName
                quantity
                price
                unit
              }
              gifts {
                productName
                quantity
                unit
              }
              createdAt
            }
          }
        pageInfo {
          endCursor
          startCursor
        }
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      first: first, //每次取多少条
      after: after,
    }
  }
}

function OrdersComment(first, after,status,rated) {
  return {
    query: `query($first: Int!, $after: String,$status:String,$rated:Boolean) {
      viewer {
        orders(first: $first, after: $after,status:$status,rated:$rated) {
          edges {
            cursor
            node {
              supplier {
                id
                name
                industryName
              }
              id
              no
              status
              statusName
              address
              receiver
              phone
              deliveryTime
              amount
              originAmount
              items {
                id
                productName
                quantity
                price
                unit
              }
              gifts {
                productName
                quantity
                unit
              }
              createdAt
            }
          }
        pageInfo {
          endCursor
          startCursor
        }
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      first: first, //每次取多少条
      after: after,
      status: status,
      rated: rated,
    }
  }
}
module.exports = {
  Orders,
  OrdersComment
};