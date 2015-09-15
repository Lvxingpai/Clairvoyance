// 当前并不执行，只有在server运行时才执行，相当于运行前的初始化准备
Meteor.startup(function(){
  // 设置session过期日期为一天
  Accounts.config({
    loginExpirationInDays: 1
  });
});