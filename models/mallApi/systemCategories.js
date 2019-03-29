const SystemCategories = {
  query: `query{
    systemCategories(root:true){
      id
      name
      children{
        id
        name
      }
    }
  }`,
}

module.exports = {
  SystemCategories
}