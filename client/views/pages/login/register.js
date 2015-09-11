Template.register.events({
  'click #register': function(event, template) {
    event.preventDefault();

    // 获取表单
    var email = template.find('input[name=email]').value,
        tel = template.find('input[name=tel]').value,
        username = template.find('input[name=username]').value,
        password = template.find('input[name=password]').value,
        rpassword = template.find('input[name=rpassword]').value;

    // 表单检测 
    if (!email || !isEmail(email)) {
      alert('请输入正确的邮箱地址');
      return;
    };

    if (!tel || !isTel(tel)) {
      alert('请输入正确的邮箱地址');
      return;
    };

    if (!username) {
      alert('请输入用户名');
      return;
    }

    if (password.length < 6) {
      alert('密码长度不够');
      return;
    } else if(!isPassword(password)) {
      alert('密码必须是数字和字母的组合');
      return;
    }

    // TODO use hash code
    if(password !== rpassword) {
      alert('两次输入的密码不对');
      return;
    }


    // 注册账户
    Accounts.createUser({
      username: username,
      email: email,
      password: password,
      profile: {
        tel: tel
      }
    }, function(error) {
      if(error){
        alert('注册失败');
        return;
      }
      Router.go('login');
    });
  }
});

// 国内手机号的规则
function isTel(str){
  var reg = /^1[3|4|5|8][0-9]\d{8}$/;
  return reg.test(str);
}

function isPassword (str){
  var reg = /^([a-z]+(?=[0-9])|[0-9]+(?=[a-z]))[a-z0-9]+$/ig;
  return reg.test(str);
}

function isEmail (str){
  var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
  return reg.test(str);
}
