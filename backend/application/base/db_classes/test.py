from main import db


class Activation(db.Model):
    __tablename__ = "activation"

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(100), nullable=False)
    account_id = db.Column(db.String(50), nullable=False)
    contract_id = db.Column(db.String(50), nullable=False)
    group_id = db.Column(db.String(50), nullable=False)
    property_id = db.Column(db.String(50), nullable=False)
    configuration_name = db.Column(db.String(120), nullable=False)
    property_version = db.Column(db.Integer, nullable=False)
    rollback_version = db.Column(db.Integer, nullable=False)
    customer_name = db.Column(db.String(120), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    notification_emails = db.Column(db.String(300), nullable=False)
    production_activation = db.Column(db.Boolean, nullable=False)
    peer_reviewer_email = db.Column(db.String(120), nullable=False)
    peer_review_link = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(1), nullable=False)
    activation_time = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "account_id": self.account_id,
            "contract_id": self.contract_id,
            "group_id": self.group_id,
            "property_id": self.property_id,
            "configuration_name": self.configuration_name,
            "property_version": self.property_version,
            "rollback_version": self.rollback_version,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "notification_emails": self.notification_emails,
            "production_activation": self.production_activation,
            "peer_reviewer_email": self.peer_reviewer_email,
            "peer_review_link": self.peer_review_link,
            "status": self.status,
            "activation_time": self.activation_time.strftime("%Y-%m-%d %H:%M:%S")
        }
