export class ChatbotService {
    public static generateReply(messageContent: string) : string {
        const query = messageContent.toLowerCase().trim();

        if (query.includes('escrow') || query.includes('payment') || query.includes('deposit') || query.includes('safe')) {
            return "Dihadi.com operates on a fully secure **Escrow Payout System**. When a client accepts a tasker's bid, the errand budget is immediately deposited and locked in the platform's escrow wallet. Payout is released to the tasker *only* after the client clicks 'Confirm Job Done', or and administrator resolves a dispute. This guarantees absolute financial safety for both parties!";
        }

        if (query.includes('fee') || query.includes('commission') || query.includes('charges') || query.includes('cut')) {
            return "To support platform operations and security escrow services, Dihadi.com collects a **5% commission fee** on completed errands. This fee is automatically deducted from the tasker's final payout. For example, on a ₹1000 budget errand, the tasker receives ₹950 and the platform treasury receives ₹50.";
        }

        if (query.includes('dispute') || query.includes('freeze') || query.includes('lock')) {
            return "If there is an issue with work completion, the client can choose to **Raise a Dispute** instead of releasing payment. This freezes the escrow funds. An admin will then review the uploaded photo proof of work and statement, and either issue a refund to the client or release payment to the tasker.";
        }

        if (query.includes('promote') || query.includes('featured') || query.includes('advertise') || query.includes('glow')) {
            return "Clients can pay a flat **₹50 promotional fee** to upgrade their errand to **Featured**. Featured errands are highlighted with a glowing neon gold border, display a ★ badge, and are pinned automatically to the top of Explore feed to attract high-rating taskers faster!";
        }

        if (query.includes('verify') || query.includes('kyc') || query.includes('identity') || query.includes('badge')) {
            return "Earner runners can verify their profiles by uploading a government-issued photo ID under their Wallet/Verification console. Once approved by an admin, a verified badge is displayed next to their name, raising their hiring success rate by up to 80%!";
        }

        if (query.includes('help') || query.includes('faq') || query.includes('options') || query.includes('hi') || query.includes('hello')) {
            return "Welcome to the **Dihadi Assistant**! You can ask me about: \n- *Escrow Payments* (type 'escrow')\n- *Platform Commission Fees* (type 'fees')\n- *Raising Disputes* (type 'disputes')\n- *Errand Promotions* (type 'promote')\n- *Profile Verification* (type 'verify')";
        }

        return "I'm the Dihadi AI Helper. I can assist you with payment security, escrow systems, dispute resolutions, and listing upgrades. Ask me about 'escrow', 'fees', 'disputes', or type 'help' for options!";
    }
}