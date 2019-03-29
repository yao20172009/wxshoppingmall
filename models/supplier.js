function Supplier(areaId,first,after) {
  return {
    query: `query($areaId: String,$first: Int,$after:String) {
      suppliers(areaId: $areaId,first:$first,after:$after) {
        edges {
          node {
            id
            name
            followed
            logo
            area {
              id
              name
              fullName
              code
            }
            industryName
            monthSales
            businesses
            address
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      areaId: areaId,
      first: first,
      after: after,
    }
  }
}

function GetMemberList(first, after) {
  return {
    query: `query($first: Int,$after:String){
      viewer{
        members(first:$first,after:$after){
          edges{
            node{
              supplier{
                id
                name
                logo
                exchangeableCards{
                  edges{
                    node{
                      id
                    }
                  }
                }
              }
              points
              level
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      first: first,
      after:after,
    }
  }
}

module.exports = {
  Supplier,
  GetMemberList
};