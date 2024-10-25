import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { currentPage: 'index' });
});

router.get('/todo-list', (req, res) => {
    res.render('todo-list', { currentPage: 'todo-list' });
});

router.get('/praesentation', (req, res) => {
    res.render('praesentation', { currentPage: 'presentation' });
});

export default router;
