const lodash = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const sumLikes = blogs.reduce((sum, blog) => sum + blog.likes, 0)
    return sumLikes
}

const favouriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return null
    }

    const maxBlog = blogs.reduce((mostLikesBlog, blog) => {
        return blog.likes > mostLikesBlog.likes ? blog : mostLikesBlog
    })

    return {
        title: maxBlog.title,
        author: maxBlog.author,
        likes: maxBlog.likes
    } 
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0) {
        return null
    }
    const counts = lodash.countBy(blogs, 'author')
    //console.log(counts)
    const maxAuthor = lodash.maxBy(Object.keys(counts), author => counts[author])
    return {
        author: maxAuthor,
        blogs: counts[maxAuthor]
    }
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) {
        return null
    }

    const groupAuthor = lodash.groupBy(blogs, 'author')
    //console.log(groupAuthor)
    const sumLikes = lodash.mapValues(groupAuthor, mapBlogs => 
        lodash.sumBy(mapBlogs, 'likes')
    )
    //console.log(sumLikes)
    const maxAuthor = lodash.maxBy(Object.keys(sumLikes), author => sumLikes[author])
    return {
        author: maxAuthor,
        likes: sumLikes[maxAuthor]
    }
}

module.exports = {
    dummy,
    totalLikes,
    favouriteBlog,
    mostBlogs,
    mostLikes
}
