function Member(supplierId) {
  return {
    query: `query($supplierId:String!) {
    member(supplierId:$supplierId){
        points
        level
        supplier{
          id
          name
          logo
        }
        points
        level
      }
    }`,
    variables: {
      supplierId: supplierId,
    }
  }
}

module.exports = {
  Member
}