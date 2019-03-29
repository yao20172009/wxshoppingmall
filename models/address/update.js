function UpdateAddress(input) {
  return {
    operationName:"updateAddress",
    query: `mutation updateAddress ($input:UpdateAddressInput!){
      updateAddress(input: $input) {
        address{
          id
          receiver
          phone
          province
          city
          county
          road
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
  UpdateAddress
};