var memoryChart = cpuChart = diskOsChart = diskIopsChart = diskUsChart = {};
var intervalId;

Template.hosts.helpers({
    'hosts': function (){
        if ($('.footable').length > 0){
            Meteor.setTimeout(function(){
                $('.footable').trigger('footable_initialize');
            }, 1000);
        };

        var hostList = DB.Host.findOne({'_id':'hostList'});
        hostList.instance_set[0]['checked'] = 'checked';
        Session.set('curHostId', hostList.instance_set[0].instance_id);
        for(var i = 0;i < hostList.instance_set.length; i++)
            hostList.instance_set[i].index = i;
        return hostList.instance_set;
    },
});

Template.hosts.events({
    // change事件监听有可能会有问题（虽然测试时，checked态转为unchecked时并不会触发）
    'change input': function(e){
        Session.set('curHostId', this.instance_id);
        Meteor.call('qingcloud.getHostDesc', Session.get('curHostId'), function(err, hostDesc){
            if (err || !hostDesc){
                console.log(err);
                console.log(hostDesc);
            };
            updateGraphData(hostDesc);
        });
    },
});

Template.hosts.onRendered(function () {
    $('.footable').footable();

    // 数据和配置的初始设置
    var singleData = {
        labels: ["January", "February", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
            {
                label: "Example dataset",
                fillColor: "rgba(220,220,220,0)",
                strokeColor: "rgba(26,179,148,0.7)",
                strokeColor: "rgba(26,179,148,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: [65, 59, 80, 81, 56, 55, 40, 1, 1, 1, 1, 1]
            }
        ]
    };

    var doubleData = {
        labels: ["January", "February", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
            {
                label: "Example dataset",
                fillColor: "rgba(220,220,220,0)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: [65, 59, 80, 81, 56, 55, 40, 1, 1, 1, 1, 1]
            },
            {
                label: "Example dataset",
                fillColor: "rgba(220,220,220,0)",
                strokeColor: "rgba(26,179,148,0.7)",
                pointColor: "rgba(26,179,148,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(26,179,148,1)",
                data: [28, 48, 40, 19, 86, 27, 90, 1, 1, 1, 1, 1]
            }
        ]
    };

    var lineOptions = {
        scaleShowGridLines: true,
        scaleGridLineColor: "rgba(0,0,0,.05)",
        scaleGridLineWidth: 1,
        bezierCurve: true,
        bezierCurveTension: 0.4,
        pointDot: true,
        pointDotRadius: 4,
        pointDotStrokeWidth: 1,
        pointHitDetectionRadius: 20,
        datasetStroke: true,
        datasetStrokeWidth: 2,
        datasetFill: true,
        responsive: true,
    };

    // Line图的初始化
    var memoryCtx = document.getElementById("hostMemory").getContext("2d");
    memoryChart = new Chart(memoryCtx).Line(singleData, lineOptions);

    var cpuCtx = document.getElementById("hostCPU").getContext("2d");
    cpuChart = new Chart(cpuCtx).Line(singleData, lineOptions);

    var diskOsCtx = document.getElementById("hostDiskOS").getContext("2d");
    diskOsChart = new Chart(diskOsCtx).Line(doubleData, lineOptions);

    var diskIopsCtx = document.getElementById("hostDiskIopsOS").getContext("2d");
    diskIopsChart = new Chart(diskIopsCtx).Line(doubleData, lineOptions);

    //var diskUsCtx = document.getElementById("hostUsOS").getContext("2d");
    //diskUsChart = new Chart(diskUsCtx).Line(doubleData, lineOptions);

    Meteor.call('qingcloud.getHostDesc', Session.get('curHostId'), function(err, hostDesc){
        if (err || !hostDesc){
            console.log(err);
            console.log(hostDesc);
        };
        updateGraphData(hostDesc);
    });

    // 定时获取数据
    intervalId = Meteor.setInterval(function(){
        //var hostDesc = DB.Host.findOne({'resource_id':'i-110ns1fq'}).meter_set;
        Meteor.call('qingcloud.getHostDesc', Session.get('curHostId'), function(err, hostDesc){
            if (err || !hostDesc){
                console.log(err);
                console.log(hostDesc);
            };
            updateGraphData(hostDesc);
        });
    }, 5 * 60 * 1000);
});


function updateGraphData(hostDesc){
    console.log('update' , Date.now());
    var hostData = {};
    var startTime = {};
    _.each(hostDesc, function(obj){
        hostData[obj.meter_id] = obj.data;
        startTime[obj.meter_id] = hostData[obj.meter_id][0][0];
        hostData[obj.meter_id][0] = hostData[obj.meter_id][0][1];
    });

    for(var i = 0;i < 12;i++){
        memoryChart.datasets[0].points[i].value = hostData['memory'][i];
        cpuChart.datasets[0].points[i].value = hostData['cpu'][i];
        diskOsChart.datasets[0].points[i].value = hostData['disk-os'][i][0];
        diskOsChart.datasets[1].points[i].value = hostData['disk-os'][i][1];
        diskIopsChart.datasets[0].points[i].value = hostData['disk-iops-os'][i][0];
        diskIopsChart.datasets[1].points[i].value = hostData['disk-iops-os'][i][1];
        //diskUsChart.datasets[0].points[i].value = hostData['disk-us-os'][i][0];
        //diskUsChart.datasets[1].points[i].value = hostData['disk-us-os'][i][1];
    }
    memoryChart.update();
    cpuChart.update();
    diskOsChart.update();
    diskIopsChart.update();
    //diskUsChart.update();
    return ;
}