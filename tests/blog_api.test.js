const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

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

describe('Blog related tests', () => {

    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('salasana123', 10)
        const user = new User({ username: 'root', name: 'rootName', passwordHash: passwordHash })
        await user.save()    
        
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

    test('the first blog title is about Arttu and dog', async () => {
        const response = await api.get('/api/blogs')
        
        const titles = response.body.map(r => r.title)

        expect(titles).toContain('Arttu ja koira')
    })

    test('identification field is named as id', async () => {
        const blogs = await api.get('/api/blogs')
        blogs.body.forEach((blog) => {
            expect(blog['id']).toBeDefined()
        })
    })

    test('a valid blog can be added', async () => {
        
        const newLogin = {
            username: 'root',
            password: 'salasana123'
        }
        const token = await helper.doLogin(newLogin)

        const newBlog = {
            title: 'Tove ja koira',
            author: 'Tove',
            url: 'Just use google boi3',
            likes: 12
        }

        await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        const response = await api.get('/api/blogs')
        const titles = response.body.map(r => r.title)
        expect(response.body).toHaveLength(initialBlogs.length + 1)
        expect(titles).toContain('Tove ja koira')
    })

    test('set 0 likes if likes is not given in post command', async () => {
        const newLogin = {
            username: 'root',
            password: 'salasana123'
        }
        const token = await helper.doLogin(newLogin)
        
        const newBlog = {
            title: 'Tove ja koira',
            author: 'Tove',
            url: 'Just use google boi3',
        }

        await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')
        const likeList = response.body.map(r => r.likes)

        expect(likeList).toContain(0)
    })


    const sendUnValidBlogAndTest = async (blog, token) => {
        await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(blog)
            .expect(400)
        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(initialBlogs.length)
    }

    test('if title or url is not give return 400', async () => {    
        const newLogin = {
            username: 'root',
            password: 'salasana123'
        }
        const token = await helper.doLogin(newLogin)
        
        // Blog without title
        let newBlog = {
            author: 'Tove',
            url: 'Just use google boi3',
            likes: 12
        }
        await sendUnValidBlogAndTest(newBlog, token)

        // Blog without url
        newBlog = {
            title: 'Tove on koira',
            author: 'Tove',
            likes: 12
        }
        await sendUnValidBlogAndTest(newBlog, token)
    })

    test('Test correct delete', async () => {
        
        const newLogin = {
            username: 'root',
            password: 'salasana123'
        }
        const token = await helper.doLogin(newLogin)

        const newBlog = {
            title: 'Tove ja koira',
            author: 'Tove',
            url: 'Just use google boi3',
            likes: 12
        }

        // First post the blog which will be deleted
        const postResp = await api
            .post('/api/blogs')
            .set('Authorization', token)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        let response = await api.get('/api/blogs')
        const blogsAtStart = response.body
        const blogToDelete = postResp.body

        // Delete the posted blog
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', token)
            .expect(204)

        response = await api.get('/api/blogs')
        const blogsAtEnd = response.body
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

        const titles = blogsAtEnd.map(r => r.title)
        expect(titles).not.toContain(blogToDelete.title)
    })

    test('Test invalid id for delete', async () => {
        
        const newLogin = {
            username: 'root',
            password: 'salasana123'
        }
        const token = await helper.doLogin(newLogin)
        
        await api
            .delete(`/api/blogs/invalidid`)
            .set('Authorization', token)
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

    test('token does not exists in post command', async () => {
        const newBlog = {
            title: 'Tove ja koira',
            author: 'Tove',
            url: 'Just use google boi3',
            likes: 12
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)
            .expect('Content-Type', /application\/json/)
        
        const response = await api.get('/api/blogs')
        const titles = response.body.map(r => r.title)
        expect(response.body).toHaveLength(initialBlogs.length)
        expect(titles).not.toContain('Tove ja koira')
    })

})

const checkInvalidUser = async (newUser, errorMsg, usersAtStart) => {
    const response = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)
    
    expect(response.body.error).toBe(errorMsg)
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
}

describe('User validation tests. One initial user.', () => {

    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('salasana123', 10)
        const user = new User({ username: 'root', name: 'rootName', passwordHash: passwordHash })
    
        await user.save()    
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()
        const newUser = {
            username: 'mrNew',
            name: 'New Mister',
            password: 'secrets'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('Invalid user: username missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            name: 'New Mister',
            password: 'secrets'
        }

        await checkInvalidUser(
            newUser,
            'User validation failed: username: Path `username` is required.',
            usersAtStart
        )
    
    })

    test('Invalid user: username minlenght 3', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mr',
            name: 'New Mister',
            password: 'secrets'
        }

        await checkInvalidUser(
            newUser,
            'User validation failed: username: Path `username` (`mr`) is shorter than the minimum allowed length (3).',
            usersAtStart
        )

    })

    test('Invalid user: username exists', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'New Mister',
            password: 'secrets'
        }

        await checkInvalidUser(
            newUser,
            'User validation failed: username: Error, expected `username` to be unique. Value: `root`',
            usersAtStart
        )
        
    })

    test('Invalid user: password missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mrNew',
            name: 'New Mister',
        }

        await checkInvalidUser(
            newUser,
            'password missing',
            usersAtStart
        )
        
    })

    test('Invalid user: password min lenght 3', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mrNew',
            name: 'New Mister',
            password: 'as'
        }

        await checkInvalidUser(
            newUser,
            'minlenght of password is 3',
            usersAtStart
        )  
    })

})

afterAll(async () => {
    await mongoose.connection.close()
})

