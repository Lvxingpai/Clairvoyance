var memoryChart = cpuChart = diskOsChart = diskIopsChart = diskUsChart = {};
var curHostId, curTime;
var interval = 60 * 60 * 1000;// 默认时间范围

Template.hosts.helpers({
    'hosts': function (){
        if ($('.footable').length > 0){
            Meteor.setTimeout(function(){
                $('.footable').trigger('footable_initialize');
            }, 1000);
        };

        var hostList = DB.Host.findOne({'_id':'hostList'});
        hostList.instance_set[0]['checked'] = 'checked';
        curHostId = hostList.instance_set[0].instance_id;
        for(var i = 0;i < hostList.instance_set.length; i++){
            hostList.instance_set[i].index = i;
            hostList.instance_set[i].vx_ip = hostList.instance_set[i].vxnets.length && hostList.instance_set[i].vxnets[0].private_ip || '';
        }
        return hostList.instance_set;
    },
});

Template.hosts.events({
    // TODO change事件监听有可能会有问题（虽然测试时，checked态转为unchecked时并不会触发）
    // 修改查看的服务器
    'change input': function(){
        curHostId = this.instance_id;
        getHostDate();
    },

    // 修改时间范围
    'change select': function (e) {
        var option = $(e.target).find("option:selected")[0];
        switch (option.index){
            case 0:
                interval = 60 * 60 * 1000;// 1h
                break;
            case 1:
                interval = 6 * 60 * 60 * 1000;// 6h
                break;
            case 2:
                interval = 7 * 24 * 60 * 60 * 1000;// 1w
                break;
            case 3:
                interval = 36 * 24 * 60 * 60 * 1000;// 1m = 36day
                break;
            case 4:
                interval = 6 * 30 * 24 * 60 * 60 * 1000;// 6m = 180d
                break;
            default:
                break;
        };
        getHostDate();
    }
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
                pointColor: "rgba(26,179,148,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(26,179,148,1)",
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

    getHostDate();
    // 定时获取数据inter
    Meteor.setInterval(function(){
        getHostDate();
    }, 5 * 60 * 1000);
});


function updateLineData(hostDesc){
    var hostData = {};
    var startTime = {};
    var scale;
    console.log(hostDesc);
    _.each(hostDesc, function(obj){
        hostData[obj.meter_id] = obj.data;
        startTime[obj.meter_id] = hostData[obj.meter_id] && hostData[obj.meter_id][0] && hostData[obj.meter_id][0][0] || 0;
        hostData[obj.meter_id] && (hostData[obj.meter_id][0] = hostData[obj.meter_id] && hostData[obj.meter_id][0] && hostData[obj.meter_id][0][1] || 0);
        scale = parseInt(obj.data.length / 12);
    });

    console.log('scale: ' , scale);
    var xLabel, index;
    for(var i = 0;i < 12;i++){
        index = i * scale;
        xLabel = new Date(curTime - (12 - i) * 5 * 60 * 1000);
        xLabel = xLabel.getTime();
        //xLabel = xLabel.toISOString();
        memoryChart.datasets[0].points[i].value = hostData['memory'] && hostData['memory'][index] || 0;
        cpuChart.datasets[0].points[i].value = hostData['cpu'] && hostData['cpu'][index] || 0;
        cpuChart.datasets[0].points[i].label = memoryChart.datasets[0].points[i].label = memoryChart.scale.xLabels[i] = xLabel;
        diskOsChart.datasets[0].points[i].value = hostData['disk-os'] && hostData['disk-os'][index] && hostData['disk-os'][index][0] || 0;
        diskOsChart.datasets[1].points[i].value = hostData['disk-os'] && hostData['disk-os'][index] && hostData['disk-os'][index][1] || 0;
        diskIopsChart.datasets[0].points[i].value = hostData['disk-iops-os'] && hostData['disk-iops-os'][index] && hostData['disk-iops-os'][index][0] || 0;
        diskIopsChart.datasets[1].points[i].value = hostData['disk-iops-os'] && hostData['disk-iops-os'][index] && hostData['disk-iops-os'][index][1] || 0;
        diskOsChart.datasets[0].points[i].label = diskOsChart.datasets[1].points[i].label = diskIopsChart.datasets[0].points[i].label = diskIopsChart.datasets[1].points[i].label = diskOsChart.scale.xLabels[i] = xLabel;
        //diskUsChart.datasets[0].points[i].value = hostData['disk-us-os'][i][0];
        //diskUsChart.datasets[1].points[i].value = hostData['disk-us-os'][i][1];
    };
    memoryChart.update();
    cpuChart.update();
    diskOsChart.update();
    diskIopsChart.update();
    //diskUsChart.update();
    return ;
}

function getHostDate(){
    curTime = Date.now();
    Meteor.call('qingcloud.getHostDesc', curHostId, undefined, {
        startTime: curTime - interval,
        endTime: curTime
    }, function(err, res){
        if (err || !res){
            console.log(err);
            console.log(res);
        };
        updateLineData(res.meter_set);
    });
}