1. Form a group of 3-5 members
	- Estrera
	- Academia
	- Orcullo
	- Tejeros
	- Leon

- **system name**
	- Lavhanan Laundry Hub.
	- The name of our project is the "Lavhanan Laundry Hub (Laundry hub management system)." We chose this name simply because it is the original name given by the business owner. Our main goal is to support the owner and help their business grow by bringing it online. We are not trying to change their shop, but rather extend it with new digital tools. By adding this online computer system, we want to make their daily work easier, keep their records more organized, and give their customers a better and faster way to track their laundry.
- **Problem to be solved**
	- The Lavhanan laundry business has a few main problems that the new computer system needs to solve. First, the staff writes all the customer orders by hand in a logbook and uses small paper receipts, which makes it hard to keep detailed records. Second, because they do not usually count every piece of clothing, some customers try to claim that their items are missing or lost. Third, when people do not pay or forget to pick up their laundry, the workers have to manually search for the customer's phone number on paper and call them one by one. Fourth, adding up the daily sales is done by hand, which can be slow and difficult to manage. Finally, customers do not have a way to know exactly when their clothes are ready for pickup. The new system will fix these problems by saving all the information online, tracking exact item counts, calculating the daily money automatically, and sending automatic text messages directly to the customers.
- **Target users**
	- The target users for the Lavhanan Laundry Hub are divided into two main groups: Employees and Customers. Here is a simple breakdown of how each role will use the system:

	- **Lavhanan Employees (Admin and Staff)**
	    
	    - **Owner / Admin:** Has full control over the computer system. They can see all the daily money earned, read the monthly sales reports, and manage the accounts for all other workers.
	        
	    - **Manager:** Helps the owner watch over the daily business. They can look at all the laundry orders, make sure the work is not slow, and fix any big problems with the customers.
	        
	    - **Cashier:** Welcomes the customer and takes the dirty laundry. They type the customer's name into the system, weigh the clothes, give the receipt, and mark the order as "paid" or "unpaid."
	        
	    - **Labandera (Laundry Worker):** Does the physical washing. They use the system to simply update the steps of the laundry (clicking buttons to show if the clothes are washing, drying, folding, or ready).
	        
	    - **Delivery Driver:** Uses the system to see the customer's home address and updates the app when the clean clothes are dropped off. _(Even if the shop only does pickups right now, this prepares the system for the future)._
	        
	- **Lavhanan Customers**
	    - People who bring their clothes to the shop. They use the simple online web app on their phones to check if their laundry is ready, see how much they need to pay, and ask the shop for help if they need it.
- Major System Functions
	**Functional Features (What the system actually does)**
	- **Record Orders Online:** The cashier can type the customer's name, the weight of the clothes, and the price into the computer instead of writing in a paper book.
	    
	- **Track Laundry Steps:** The workers (Labandera) can click simple buttons to show what is happening to the clothes, like moving them from "Washing" to "Drying" to "Ready."
	    
	- **Count Specific Clothes:** The system can record the exact number and type of clothes for certain customers. This stops people from saying the shop lost their items.
	    
	- **Track Payments:** The system will save if an order is "Paid" or "Unpaid," which makes it very easy to handle "wash now, pay later" customers.
	    
	- **Send Automatic Text Messages:** The system will automatically send an SMS to the customer when their clothes are ready, if there is a power outage, or if they forgot to pick up their clothes.
	    
	- **Calculate Daily Sales (Reports):** The system will automatically add up all the money the shop made in a day or a month, so the owner does not have to do the math by hand.
	    
	- **Customer Online Checker:** Customers can use a simple web page on their phones to check if their laundry is finished.
    

	**Non-Functional Features (How the system behaves and feels)**

	- **Easy to Use (User-Friendly):** The app will be very simple. Workers only need to learn a few clicks, and customers will have a very easy screen to look at.
	    
	- **Safe and Secure:** The information is protected. Customers can only see their own laundry, and only the Owner or Admin can look at the daily money and reports.
	    
	- **Mobile-Friendly:** The customer app and the delivery driver features will work smoothly and look good on small smartphone screens.
	    
	- **Fast and Reliable:** When a worker clicks a button to say the laundry is done, the system updates quickly so the customer gets the text message right away.
	
- Information/Data needed
	- To make the new computer system work, it needs to collect and save specific everyday information. First, we need basic customer details, like their names and phone numbers, so the system can send them text messages. Second, we need laundry details for every single order. This includes the weight of the clothes, the exact number of clothing items (to stop customers from saying things are missing), and any special washing instructions. Third, we need money details, which means recording the total price and saving if the customer has already "paid" or if the order is still "unpaid." Finally, the system needs tracking details to remember exactly what step the clothes are in like washing, drying, or ready for pickup—and worker details to know which employee is doing the job.
	
- **Expected System Outputs (What we will build)**
	- The final project will be delivered in two ways: a **Web App (Website)** and an **Android App**. Both the Lavhanan employees and the customers will be able to log in and use both of these platforms to check their laundry or do their work.

- **System Constraints (Limitations)**
	- We **cannot build an iOS (Apple/iPhone) version** of the mobile app. This is because the specific programming tools (framework) we are using to build the project only support Android. However, this is not a big problem because iPhone users—whether they are employees or customers—can simply open the Web App on their phone's internet browser to use the system perfectly fine.
- Security Requirements
	- To keep the business and customer information safe, the system will have strict security rules. First, everyone using the app must log in with a secure password so strangers cannot get inside. Second, the system will use strict access limits based on exactly who is logging in. Customers can only see their own laundry tickets and cannot look at other people's phone numbers. For the employees, normal workers can only see and update the laundry orders they are working on. The Manager is given a middle level of access; they can see all of the laundry orders and customer details to help solve shop problems, but they cannot change the most private system settings. Finally, only the Owner or Admin is allowed to see the big financial sales reports and the total money earned. The system will also protect the records by stopping anyone from accidentally deleting an order, especially if the customer still has an "unpaid" bill.
- Other Requirements/Constraints
	- There are a few other important rules and limits for this project. First, the business owner actually owns the computer server and keeps it right at the laundry shop. Because the server is nearby, the workers can still use the system on the shop's local Wi-Fi even if the outside internet is slow or goes down. However, the shop will still need some internet connection to send the automatic text messages and to let customers check their laundry from their own homes. Second, the new computer system must be able to connect to a thermal receipt printer, so the shop can keep printing small paper tags for the laundry baskets. Third, the workers and the manager must use Android phones, Android tablets, or a normal computer, since there is no Apple iPhone version. Finally, the system must include a very simple video tutorial so everyone can easily learn how to use the new app.

```
expected system output would be webapp or website and android app. the constraint is we can't develop ios version because the framework we will use is for android
both can be used by employees and customers
```
