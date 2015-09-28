// var lxpThriftType = Meteor.npmRequire('lxpthrift2').Userserver_types;// 带参数时使用
// var thrift = Meteor.npmRequire('thrift');  //带int64参数时使用

Meteor.methods({
    'smsCenter.sendSmsFunc': function (text, recipients) {
        try {
            var result = smsCenter.SmsCenter.sendSms(text, recipients);
            console.log('Success in sending msg to' + recipients);
            return true;
        } catch (e) {
            console.log('Failed in sendSms');
            console.log(e);
            return false;
        }
    },

    'smsCenter.pingFunc': function () {
        try {
            var result = smsCenter.SmsCenter._ping();
            console.log('Success in ping smscenter');
            console.log(result);
            return result;
        } catch (e) {
            console.log('Failed in ping smscenter');
            console.log(e);
            return false;
        }
    }
})