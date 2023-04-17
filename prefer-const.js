const title = (level => {
    if (level < 10) {
        return '新手';
    }
    else if (level < 40) {
        return '战士';
    }
    else {
        return '勇者';	
    }
})(level);
