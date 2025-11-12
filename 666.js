/*
 *
 *
*******************************
[rewrite_local]
^https:\/\/api\.train2win\.cn\/v1\/users\/myInfo url script-response-body https://raw.githubusercontent.com/WeiGiegie/666/main/xintiao.js

# 汽车补贴活动解锁 - API5 节点
^https:\/\/api5-normal-sinfonlineb\.dcarapi\.com url script-response-body https://raw.githubusercontent.com/ciaooo66/123123/refs/heads/main/666.js

# 汽车补贴活动解锁 - API3 节点  
^https:\/\/api3-normal-sinfonlineb\.dcarapi\.com url script-response-body https://raw.githubusercontent.com/ciaooo66/123123/refs/heads/main/666.js

[mitm]
hostname = api5-normal-sinfonlineb.dcarapi.com, api3-normal-sinfonlineb.dcarapi.com
*
*
*/

let body = $response.body;
let obj = JSON.parse(body);

// 设置新的时间范围
const newStartTime = 1762732800; // 2025年11月10日 00:00:00
const newEndTime = 1767110400;   // 2025年12月30日 23:59:59
const newStartDate = "2025-11-10";
const newEndDate = "2025-12-30";

// 递归处理所有活动
function processActivities(activity) {
    if (!activity) return;
    
    // 检查是否为需要处理的活动状态
    if ([3, 4, 5].includes(activity.activity_status) && activity.support_claim === 1) {
        
        // 修改活动状态为进行中
        activity.activity_status = 2;
        
        // 修改时间信息
        if (activity.subsidy_info) {
            activity.subsidy_info.start_time = newStartTime;
            activity.subsidy_info.end_time = newEndTime;
            activity.subsidy_info.start_date = newStartDate;
            activity.subsidy_info.end_date = newEndDate;
            activity.subsidy_info.coupon_remain = -1;
        }
        
        // 修改活动日期字符串显示
        if (activity.activity_date_str) {
            if (activity.activity_date_str.includes("11.11-11.15")) {
                activity.activity_date_str = "11.10-12.30  随时可领";
            } else if (activity.activity_date_str.includes("每天上午10点开放申领")) {
                activity.activity_date_str = "随时可领";
            }
        }
        
        // 精准处理按钮列表
        if (activity.button_list && activity.button_list.length > 0) {
            activity.button_list.forEach(button => {
                // 只处理状态按钮，不处理咨询按钮
                if (button.button_text && 
                   (button.button_text === "待开始" || 
                    button.button_text === "已结束" || 
                    button.button_text === "已领完" ||
                    button.button_text === "待开始" ||
                    button.button_url === "")) {
                    
                    // 使用当前活动的sku_id生成专属URL
                    if (activity.subsidy_info && activity.subsidy_info.sku_id) {
                        const skuId = activity.subsidy_info.sku_id;
                        const minPrice = activity.subsidy_info.min_price || 1000;
                        const maxPrice = activity.subsidy_info.max_price || 10000;
                        const activityName = encodeURIComponent(activity.subsidy_info.sku_name || "汽车消费补贴");
                        
                        // 构建专属弹窗URL
                        button.button_url = `sslocal://lynxview_popup?surl=https%3A%2F%2Fapi.dcarapi.com%2Fmotor%2Ffeoffline%2Flynx_gov_subsidy%2Fpages%2Fclaim-popup%2Ftemplate.js&bdhm_bid=lynx_gov_subsidy&bdhm_pid=page_gov_consume_coupon_landing_popup&use_xbridge3=1&gravity=bottom&height_percent=70&radius=12&keyboard_adjust=1&enable_canvas=1&enable_canvas_optimize=1&disable_outside_click_close=0&need_caculate_real_contentheight=1&enable_perf_collection=1&disable_bounce=1&show_loading=0&enable_code_cache=1&min_gecko_version=7564682066768429098&type=claim&activity_name=${activityName}&max_price=${maxPrice}&min_price=${minPrice}&union_coupon_page=false&sku_id=${skuId}&mask_color=0000007a&container_bg_color=00000000`;
                    }
                }
            });
        }
    }
    
    // 递归处理嵌套的其他活动列表
    if (activity.other_activity_list && Array.isArray(activity.other_activity_list)) {
        activity.other_activity_list.forEach(subActivity => {
            processActivities(subActivity);
        });
    }
}

// 额外处理：确保所有活动的时间范围正确
function updateAllActivitiesTime(activity) {
    if (!activity) return;
    
    if (activity.subsidy_info) {
        activity.subsidy_info.start_time = newStartTime;
        activity.subsidy_info.end_time = newEndTime;
        activity.subsidy_info.start_date = newStartDate;
        activity.subsidy_info.end_date = newEndDate;
        
        // 确保所有活动都有足够的票数
        if (activity.subsidy_info.coupon_remain === 0) {
            activity.subsidy_info.coupon_remain = -1;
        }
    }
    
    // 递归处理嵌套活动
    if (activity.other_activity_list && Array.isArray(activity.other_activity_list)) {
        activity.other_activity_list.forEach(subActivity => {
            updateAllActivitiesTime(subActivity);
        });
    }
}

// 主处理函数
function mainProcess() {
    // 处理主活动数据
    if (obj.data) {
        // 处理单个活动
        processActivities(obj.data);
        
        // 处理other_activity_list中的活动
        if (obj.data.other_activity_list && Array.isArray(obj.data.other_activity_list)) {
            obj.data.other_activity_list.forEach(activity => {
                processActivities(activity);
            });
        }
        
        // 应用时间修改到所有活动
        updateAllActivitiesTime(obj.data);
        
        if (obj.data.other_activity_list && Array.isArray(obj.data.other_activity_list)) {
            obj.data.other_activity_list.forEach(activity => {
                updateAllActivitiesTime(activity);
            });
        }
    }

    // 处理嵌套结构（如果存在tab_info）
    if (obj.data && obj.data.tab_info && Array.isArray(obj.data.tab_info)) {
        obj.data.tab_info.forEach(tab => {
            if (tab.activity_list && Array.isArray(tab.activity_list)) {
                tab.activity_list.forEach(activity => {
                    processActivities(activity);
                    updateAllActivitiesTime(activity);
                });
            }
        });
    }

    // 处理根级别的活动列表
    if (obj.data && obj.data.activity_list && Array.isArray(obj.data.activity_list)) {
        obj.data.activity_list.forEach(activity => {
            processActivities(activity);
            updateAllActivitiesTime(activity);
        });
    }
}

// 执行主处理
mainProcess();

console.log("汽车补贴活动解锁脚本执行完成");

$done({body: JSON.stringify(obj)});
