process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { request } = require("express");

let _book;
let _isbn;

beforeEach(async function () {
    const result = await db.query(
        `INSERT INTO books (
            isbn, amazon_url, author, language, pages, publisher, title, year
        )
        VALUES (
            '123456789', 'https://amazon.com/book', 'Mr. Write', 'english', 999, 'Publisher & Co', 'Important Book', 2010
        )
        RETURNING isbn`
    );
    
    _book = result.rows[0];
    _isbn = result.rows[0].isbn;
});

afterEach(async function () {
    await db.query(
        `DELETE FROM books`
    );
});

afterAll(async function () {
    await db.end();
});

describe("GET /", function () {
    test("returns a list of all books", async function () {
        const response = await request(app).get("/books");
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            _book
        });
    });
});

describe("GET /:isbn", function () {
    test("returns a single book by isbn", async function () {
        const response = await request(app).get(`/books/${_isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            _book
        });
    });
    test("returns a 404 for invalid isbn", async function () {
        const response = await request(app).get('/books/0');
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /", function () {
    test("creates a new book", async function () {
        const response = await request(app).post('/').send({
            isbn: '987654321', amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            isbn: '987654321', amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
    });
    test("returns a 400 for invalid book data", async function () {
        const badPages = await request(app).post('/').send({
            isbn: '987654321', amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 'I am not a number',
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
        expect(badPages.statusCode).toEqual(400);
        const badIsbn = await request(app).post("/").send({
            isbn: 987654321, amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
        expect(badIsbn.statusCode).toEqual(400);
    });
});

describe("PUT /:isbn", function () {
    test("updates a book (but not its isbn)", async function () {
        const response = await request(app).put(`/books/${_isbn}`).send({
            amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            isbn: '123456789', amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
    });
    test("returns a 404 for invalid isbn", async function () {
        const response = await request(app).put('/books/0').send({
            amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
        expect(response.statusCode).toEqual(404);
    });
    test("return a 400 if user attempts to edit isbn", async function () {
        const response = await request(app).put(`/books/${_isbn}`).send({
            isbn: '987654321', amazon_url: 'https://amazon.com/book-two',
            author: 'Mrs. Write', language: 'english', pages: 777,
            publisher: 'Book Making Inc', title: 'Vampires are Hot', year: 2013
        });
        expect(response.statusCode).toEqual(400);
    });
});

describe("DELETE /:isbn", function () {
    test("deletes a book by isbn", async function () {
        const response = await request(app).delete(`/books/${_isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            message: "Book deleted"
        });
    });
    test("returns a 404 for invalid isbn", async function () {
        const response = await request(app).delete('/books/0');
        expect(response.statusCode).toEqual(404);
    });
});