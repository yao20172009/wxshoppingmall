function CanUpdateArea(actions) {
  return {
    query: `query can($actions:[CanActionItemInput]) {
      can(actions: $actions){
      actions {
        action
        model
        can
      }
    }
  }`,
    variables: {
      actions: actions,
    }
  }
}

function CreatePromotionView(input) {
  return {
    query: `mutation createPromotionView($input:CreatePromotionViewInput!){
      createPromotionView(input:$input){
        status
        clientMutationId
      }
    }`,
    variables: {
      input:input
    }
  }
}


module.exports = {
  CanUpdateArea,
  CreatePromotionView
}

  // const CanUpdateArea = {
  //   query: `can(actions: [{action: "updateArea",model: "user"}]{
  //     actions {
  //       action
  //       model
  //       can
  //     }
  //   }`,
  // }
  // module.exports = {
  //   CanUpdateArea
  // }