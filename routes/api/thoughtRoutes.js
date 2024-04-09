const router = require('express').Router();
const Thought = require('../../models/Thought.js');
const User = require('../../models/User.js');
const { ReactionSchema } = require('../../models/Reaction.js');

router.get('/', async (req, res) => {
    try {
        const thoughts = await Thought.find().select('-__v');
        res.json(thoughts);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get('/:thoughtId', async (req, res) => {
    try {
        const thought = await Thought.findById(req.params.thoughtId).select('-__v').populate('reactions');
        if (!thought) {
            res.status(404).json({ message: 'Thought not found!' });
            return;
        }
        res.json(thought);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post('/', async (req, res) => {
    try {
        const { thoughtText, username, userId } = req.body;

        if (!thoughtText || !username) {
            return res.status(400).json({ message: 'Missing required fields!' });
        }

        const newThought = await Thought.create({ thoughtText, username });

        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { thoughts: newThought._id } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        res.json(newThought);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.put('/:thoughtId', async (req, res) => {
    try {
        const updatedThought = await Thought.findByIdAndUpdate(
            req.params.thoughtId,
            req.body,
            { new: true }
        );

        if (!updatedThought) {
            return res.status(404).json({ message: 'Thought not found!' });
        }
        res.json(updatedThought);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.delete('/:thoughtId', async (req, res) => {
    try {
        const thoughtId = req.params.thoughtId;

        const deletedThought = await Thought.findByIdAndDelete(thoughtId);

        if (!deletedThought) {
            return res.status(404).json({ message: 'Thought not found!' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { thoughts: thoughtId },
            { $pull: { thoughts: thoughtId } },
            { new: true }
        );

        res.json({ message: 'Thought deleted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting thought!' });
    }
});

router.post('/:thoughtId/reactions', async (req, res) => {
    try {
        const thoughtId = req.params.thoughtId;
        const reactionBody = req.body.reactionBody;

        const newReaction = new Reaction({ reactionBody });

        await newReaction.save();

        const updatedThought = await Thought.findByIdAndUpdate(
            thoughtId,
            { $push: { reactions: newReaction._id } },
            { new: true }
        );

        if (!updatedThought) {
            return res.status(404).json({ message: 'Thought not found!' });
        }
        res.json({ message: 'Reaction created successfully!', reaction: newReaction });
    } catch (err) {
        res.status(400).json(err);
    }
});


router.delete('/:thoughtId/reactions/:reactionId', async (req, res) => {
    try {
        const thoughtId = req.params.thoughtId;
        const reactionId = req.params.reactionId;

        const updatedThought = Thought.findByIdAndUpdate(
            thoughtId,
            { $pull: { reactions: reactionId } },
            { new: true }
        );

        if (!updatedThought) {
            return res.status(404).json({ message: 'Thought not found!' });
        }

        await ReactionSchema.findByIdAndDelete(reactionId);

        res.json({ message: 'Reaction removed successfully!' });
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;