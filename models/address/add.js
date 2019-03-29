function AddAddress(input) {
  return {
    operationName:"createAddress",
    query: `mutation createAddress($input: CreateAddressInput!){
      createAddress(input:$input){
        address{
          phone
          province
          city
          county
          road
          receiver
          default
        }
      }
    }`,
    // linkMan, mobile, selProvince, selCity, selDistrict, address, code
    variables: {
      input: input
    }
  }
}

module.exports = {
  AddAddress
};