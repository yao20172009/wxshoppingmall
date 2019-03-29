// 单个消息读
function ReadNotification(input) {
  return {
    operationName: "readNotification",
    query: `mutation readNotification($input: ReadNotificationInput!) {
      readNotification(input: $input) {
        status
        clientMutationId
        unreadCount
      }
    }`,
    variables: {
      input: input
    }
  }
}

//多个消息读
function ReadAllNotifications(input) {
  return {
    operationName: "readAllNotifications",
    query: `mutation readAllNotifications($input:ReadAllNotificationsInput!){
      readAllNotifications(input:$input){
        status
        clientMutationId
        unreadCount
      }
    }`,
    variables: {
      input: input
    }
  }
}

//删除单个消息
function DeleteNotification(input) {
  return {
    operationName: "deleteNotification",
    query: `mutation deleteNotification($input:DeleteNotificationInput!){
      deleteNotification(input:$input){
        status
        clientMutationId
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  ReadNotification,
  ReadAllNotifications,
  DeleteNotification
};