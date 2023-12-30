const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

const initialBlogs = [
    {
        title: 'Arttu ja koira',
        author: 'Arttu',
        url: 'Just use google boi',
        likes: 45
    },
    {
        title: 'Saana ja koira',
        author: 'Srttu',
        url: 'Just use google boi2',
        likes: 25
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})
    let blogObject = new Blog(initialBlogs[0])
    await blogObject.save()
    blogObject = new Blog(initialBlogs[1])
    await blogObject.save()
})

test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
  
    expect(response.body).toHaveLength(initialBlogs.length)
})

test('the first blog title is about Arttu driving a car', async () => {
    const response = await api.get('/api/blogs')
    
    const titles = response.body.map(r => r.title)

    expect(titles).toContain('Arttu ja koira')
    //expect(response.body[0].title).toBe('Arttu ajaa autolla')
})

test('identification field is named as id', async () => {
    const blogs = await api.get('/api/blogs')
    blogs.body.forEach((blog) => {
        expect(blog['id']).toBeDefined()
    })
})

test('a valid blog can be added', async () => {
    const newBlog = {
        title: 'Tove ja koira',
        author: 'Tove',
        url: 'Just use google boi3',
        likes: 12
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    
    const response = await api.get('/api/blogs')
    const titles = response.body.map(r => r.title)
    expect(response.body).toHaveLength(initialBlogs.length + 1)
    expect(titles).toContain('Tove ja koira')
})

test('set 0 likes if likes is not given in post command', async () => {
    const newBlog = {
        title: 'Tove ja koira',
        author: 'Tove',
        url: 'Just use google boi3',
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const likeList = response.body.map(r => r.likes)

    expect(likeList).toContain(0)
})


const sendUnValidBlogAndTest = async (blog) => {
    await api
        .post('/api/blogs')
        .send(blog)
        .expect(400)
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(initialBlogs.length)
}

test('if title or url is not give return 400', async () => {    
    // Blog without title
    let newBlog = {
        author: 'Tove',
        url: 'Just use google boi3',
        likes: 12
    }
    await sendUnValidBlogAndTest(newBlog)

    // Blog without url
    newBlog = {
        title: 'Tove on koira',
        author: 'Tove',
        likes: 12
    }
    await sendUnValidBlogAndTest(newBlog)
})

test('Test correct delete', async () => {
    let response = await api.get('/api/blogs')
    const blogsAtStart = response.body
    const blogToDelete = blogsAtStart[0]

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

    response = await api.get('/api/blogs')
    const blogsAtEnd = response.body
    expect(blogsAtEnd).toHaveLength(initialBlogs.length - 1)

    const titles = blogsAtEnd.map(r => r.title)
    expect(titles).not.toContain(blogToDelete.title)
})

test('Test invalid id for delete', async () => {
    await api
        .delete(`/api/blogs/invalidid`)
        .expect(400)

    response = await api.get('/api/blogs')
    const blogsAtEnd = response.body
    expect(blogsAtEnd).toHaveLength(initialBlogs.length)
})

test('Test update likes', async () => {
    let response = await api.get('/api/blogs')
    const blogsAtStart = response.body
    const blogToEdit = blogsAtStart[0]
    const editedBlog = {
        title: blogToEdit.title,
        author: blogToEdit.author,
        url: blogToEdit.url,
        likes: 10
    } 

    await api
        .put(`/api/blogs/${blogToEdit.id}`)
        .send(editedBlog)
        .expect(204)

    response = await api.get('/api/blogs')
    const blogsAtEnd = response.body
    
    const newEditedBlog = blogsAtEnd.find(blog => blog.id === blogToEdit.id)
    
    expect(newEditedBlog.likes).toBe(editedBlog.likes)
})


afterAll(async () => {
    await mongoose.connection.close()
})

