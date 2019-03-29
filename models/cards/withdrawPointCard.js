function WithdrawPointCard(input) {
  return {
    operationName: "withdrawPointCard",
      query: `mutation withdrawPointCard($input:WithdrawPointCardInput!){
    withdrawPointCard(input:$input){
      stautus
      clientMutationId
      wxCardLists{
        cardId
        cardExt
      }
    }
  }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  WithdrawPointCard
};