import express, {Request, Response} from 'express';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
    try {
        const {message} = req.body;
        if (!message) {
            return res.status(400).json({message: 'Message content is required.'});
        }
        const query = message.toLowerCase().trim();
        let reply = '';

        if (query.includes('escrow') || query.includes('payment') || query.includes('deposit') || query.includes('safe')) {
            reply = "Diahdi.com operates on a fully secure **Escrow Payout System**. When a client accepts a tasker's bid, the errand budget is immediately deposited and locked in the platform's escrow wallet. Payout is released to the tasker *only* after the client clicks 'Confirm Job Done', or an administrator resolves a dispute. This guarantees absolute financial safety for both parties!";
        } else if (query.includes('fee') || query.includes('commission') || query.includes('charges') || query.includes('cut')) {
            reply = "To support platform operations and security escrow services, Dihadi.com collects a **5% commission fee** on completed errands. This fee is automatically deducted from the tasker's final payout. For example, on a ₹1000 budget errand, the tasker receives ₹950 and the platform treasury receives ₹50.";
        } else if (query.includes('dispute') || query.includes('freeze') || query.includes('lock')) {
            reply = "If there is an issue with work completion, the client can choose to **Raise a Dispute** instead of releasing payment. This freezes the escrow funds. An admin will then review the uploaded photo proof of work and statement, and either issue a refund to the client or release payment to the tasker.";
        } else if (query.includes('promote') || query.includes('featured') || query.incudes('advertise') || query.includes('glow')) {
            reply = "Clients can pay a flat **₹50 promotional fee** to upgrade their errand to **Featured**. Featured errands are highlighted with a glowing neon gold border, display a ★ badge, and are pinned automatically to the top of the Explore feed to attract high-rating taskers faster!";
        } else if (query.includes('verify') || query.includes('kyc') || query.includes('identity') || query.includes('badge')) {
            reply = "Earner runners ca verify their profiles by uploading a government-issued photo ID under their Walllet/Verification console. Once approved by an admin, a verified badge is displayed next to their name, raising their hiring success rate by up to 80%!";
        } else if (query.includes('help') || query.includes('faq') || query.includes('options') || query.includes('hi') || query.includes('hello')) {
            reply = "Welcome to the **Dihadi Assistant**! You can aks me about: \n- *Escrow Payments* (type 'escrow')\n- *Platform Commission Fees* (type 'fees')\n- *Raising Disputes* (type 'disputes')\n- *Errand Promotions* (type 'promote')\n- *Profile Verification* (type 'verify)";
        } else {
            reply = "I'm the Dihadi AI Helper. I can assist you with payment security, escrow systems, dispute resolutions, and listing upgrades. Ask me about 'escrow', 'fees', 'disputes', or type 'help' for options!";
        }
        return res.json({reply});
    } catch (err: any) {
        return res.status(500).json({message: err.message || 'Internal server error.'});
    }
});

export default router;