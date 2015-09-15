// var lxpThriftType = Meteor.npmRequire('lxpthrift2').Userserver_types;// 带参数时使用
// var thrift = Meteor.npmRequire('thrift');  //带int64参数时使用

// sms服务相关的对象都在这里操作
var smsThrift = new ThriftClass('smscenter', 'lxp-sms-thrift', ['SmsCenter']);
smsThrift.createService();
// _ping();

function sendSms(text, recipients){
  try {
    var result = smsThrift.SmsCenter.sendSms(text, recipients);
    console.log('Success in sending msg to 13617590188');
    return true;
  } catch (e){
    console.log('Failed in sendSms');
    console.log(e);
    return false;
  }
}

function _ping(){
  try {
    var result = smsThrift.SmsCenter._ping();
    console.log('Success in ping smscenter');
    console.log(result);
    return result;
  } catch (e){
    console.log('Failed in ping smscenter');
    console.log(e);
    return false;
  }
}
