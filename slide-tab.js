import { queryUsage } from '../../services/help';
import { throttle } from 'lodash';
export default {
    name: 'Help',
    data() {
        return {
            body: null, // body (-__-!)
            posts: [], // 拉取到所有的文章
            currentPost: {}, // 当前选中的 Tab 的内容
            startPos: [], // 初始 Tab 的 位置信息
            transform: {}, // 滑动时的样式
            value: 0, // 滑动目标值
            deltaX: 0, // 滑动偏移量
            isMoving: false, // 是否在滑动中
            halfBodyWidth: 0, // 屏宽的一半
            lastItem: {}, // 获取最后一个 Tab
            startValue: 0, // touchStart 记录当前目前滑动位置
            margin: 26, // 每个 Tab 的间距
            threshold: 0.1, // 超过边界时的阈值
            video: null, // 视频
            poster: null, // 视频封面
        };
    },
    watch: {
        $route(to) {
            this.handleQuery();
        }
    },
    created() {
        this.handleQuery();
    },
    computed: {
        isMobile: () => window.ua.phone
    },
    mounted() {
        if (!this.isMobile) {
            this.body = document.body || document.documentElement;
            this.body.addEventListener('mousewheel', throttle(e => this.handleBodyScroll(e), 300));
            // firefox
            this.body.addEventListener('DOMMouseScroll', throttle(e => this.handleBodyScroll(e), 300));
        }
        this.halfBodyWidth = document.body.clientWidth / 2;
    },
    beforeDestroy() {
        this.body.removeEventListener('mousewheel', this.handleBodyScroll);
        this.body.removeEventListener('DOMMouseScroll', this.handleBodyScroll);
    },
    methods: {
        findUpTag(el, className) {
            while (el.parentNode) {
                el = el.parentNode;
                if (`.${el.className}` === className) {
                    return el;
                }
            }
            return null;
        },
        handleBodyScroll(e) {
            const isMdDom = this.findUpTag(e.target, '.markdown-wrapper');
            if (isMdDom) {
                document.body.classList.add('noscroll');
            }
            else {
                document.body.classList.remove('noscroll');
            }
        },
        handleQuery() {
            queryUsage().then(data => {
                this.posts = data.data[0].posts;
                this.currentPost = data.data[0].posts[0];
                // 移动端获取 Tab 的初始位置
                if (this.isMobile) {
                    this.$nextTick(() => {
                        const list = this.$refs.tabList;
                        list.forEach(li => {
                            this.startPos.push(li.getBoundingClientRect());
                        });
                        this.lastItem = this.startPos[this.startPos.length - 1];
                    });
                }
                this.initVideo();
            }).catch(e => {
                console.log(e);
            });
        },
        initVideo() {
            this.$nextTick(() => {
                this.poster = document.querySelector('#md-poster');
                this.video = document.querySelector('#md-video');
                if (this.poster) {
                    this.poster.addEventListener('click', this.handelClickPoster, false);
                }
            });
        },
        handelClickPoster() {
            if (this.video) {
                this.video.play();
                this.poster.style.display = 'none';
            }
        },
        handelChangeTab(e, data, index) {
            if (this.isMobile) {
                const width = e.target.getBoundingClientRect().width;
                // 如果初始左边位置大于屏幕中心点减去当前 Tab 的宽度一半，意味着可以向左或者向右滑动
                if (this.startPos[index].left > this.halfBodyWidth - (width / 2)) {
                    this.value = this.halfBodyWidth - this.startPos[index].left - (width / 2);
                }
                else {
                    this.value = 0;
                }
                // 如果当前滚动值 小于 屏宽减去最后一个的左边位置和宽度，意味着要滚动到最后一个可视区域
                if (this.value < (this.halfBodyWidth * 2) - this.lastItem.left - this.lastItem.width) {
                    this.value = (this.halfBodyWidth * 2) - this.lastItem.left - this.lastItem.width - this.margin;
                }
                this.transform = this.setTransfrom(this.value);
                // 切换 Tab 重置滚动条到0
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }
            // pc 只赋值给当前 Tab，不做 taransform
            this.currentPost = data;
            this.initVideo();
        },
        onPanStart(e) {
            this.isMoving = true;
            this.startValue = this.value;
        },
        onPanMove(e) {
            this.value = (this.startValue + e.deltaX) * 1.1;
            // 如果滑动时已经超过 Tab 左边或右边，可以继续动但是要乘一个系数
            if (this.value > 0) {
                this.value = this.value * this.threshold;
            }
            if (this.value < this.halfBodyWidth * 2 - this.lastItem.left - this.lastItem.width - this.margin) {
                this.value = (this.halfBodyWidth * 2) - this.lastItem.left - this.lastItem.width + this.value * this.threshold;
            }
            this.transform = this.setTransfrom(this.value);
        },
        onPanEnd(e) {
            this.isMoving = false;
            // 滑动结束时如果超过 Tab 左边或右边就归位
            if (this.value > 0) {
                this.value = 0;
            }
            if (this.value < (this.halfBodyWidth * 2) - this.lastItem.left - this.lastItem.width) {
                this.value = (this.halfBodyWidth * 2) - this.lastItem.left - this.lastItem.width - this.margin;
            }
            this.transform = this.setTransfrom(this.value);
        },
        setTransfrom(value) {
            return {
                touchAction: 'pan-x',
                transform: `translate3d(${value}px, 0, 0)`,
                WebkitTransform: `translate3d(${value}px, 0, 0)`,
                MozTransform: `translate3d(${value}px, 0, 0)`
            };
        }
    }
};
